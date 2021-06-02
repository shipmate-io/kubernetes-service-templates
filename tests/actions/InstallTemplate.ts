// @ts-ignore
import exec from 'await-exec'
import _ from 'lodash'
import tmp, { DirResult as Directory } from 'tmp'
import ParseTemplate from '@/actions/ParseTemplate'
import BuildImage from '@/docker/BuildImage'
import * as k8s from '@kubernetes/client-node';
import { Volume, Container, Image, Entrypoint, ConfigFile, ParsedTemplate, Variables, StatelessSet, CronJob, Job } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { Base64 } from 'js-base64';

tmp.setGracefulCleanup()

export class InstallTemplate
{
    directory: Directory

    constructor()
    {
        this.directory = tmp.dirSync()
    }

    public async execute(
        codeRepositoryPath: string|null, templatePath: string, templateVersion: string, variables: Variables, 
        environment: Variables, initializationTimeInSeconds: number
    ): Promise<ParsedTemplate>
    {
        const applicationSlug = 'app-'+uuidv4().substring(0, 8)
        const serviceName = 'svc-'+uuidv4().substring(0, 8)
        const template = await (new ParseTemplate).execute(
            applicationSlug, serviceName, templatePath, templateVersion, variables, environment
        )

        try {
            await this.buildImages(codeRepositoryPath, template)
            const entrypoints = this.parseEntrypoints(template)
            await this.createCluster(applicationSlug, entrypoints)
            await this.importImages(applicationSlug, template)

            const kc = new k8s.KubeConfig();
            kc.loadFromDefault();

            const k8sCoreV1Api = kc.makeApiClient(k8s.CoreV1Api);
            const k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);
            const k8sBatchV1Api = kc.makeApiClient(k8s.BatchV1Api);
            
            await this.createVolumes(k8sCoreV1Api, template)
            await this.createConfigFiles(k8sCoreV1Api, template)
            await this.createStatelessSets(k8sCoreV1Api, k8sAppsV1Api, template)
            await this.createCronJobs(k8sCoreV1Api, k8sBatchV1Api, template)
            await this.createJobs(k8sCoreV1Api, k8sBatchV1Api, template)
            // daemon_set
            await this.createEntrypoints(k8sCoreV1Api, template)

            k8sCoreV1Api.listNamespacedPod('default').then((res) => {
                console.log(res.body);
            });

        } catch (error) {
            await this.deleteCluster(applicationSlug)
            throw error
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * initializationTimeInSeconds))

        return template
    }

    private async buildImages(codeRepositoryPath: string|null, template: ParsedTemplate): Promise<void>
    {
        const images: Image[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'image') continue
            images.push(resource)
        }

        if(images.length === 0) return

        if(codeRepositoryPath === null) {
            throw new Error("No code repository path provided.")
        }

        for(const image of images) {
            await new BuildImage().execute(codeRepositoryPath, template, image)
        }
    }

    private parseEntrypoints(template: ParsedTemplate): Entrypoint[]
    {
        const entrypoints: Entrypoint[] = []

        template.template.deployment.forEach(resource => {

            if (resource.type !== 'entrypoint') return

            const minPort = 30000
            const maxPort = 32767
            const randomPort = Math.floor(Math.random() * (maxPort - minPort)) + minPort

            resource.host_port = randomPort

            entrypoints.push(resource)

        })

        return entrypoints;
    }

    private async createCluster(applicationSlug: string, entrypoints: Entrypoint[]): Promise<void>
    {
        const hostPorts = entrypoints
            .map((entrypoint: Entrypoint) => `-p "${entrypoint.host_port}:${entrypoint.host_port}@agent[0]"`)
            .join(' ')

        await exec(`k3d cluster create smoothy-${applicationSlug} ${hostPorts} --agents 1`)
    }

    private async importImages(applicationSlug: string, template: ParsedTemplate): Promise<void>
    {
        const images: Image[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'image') continue
            images.push(resource)
        }

        if(images.length === 0) return

        for(const image of images) {
            await exec(`k3d image import ${image.id}:latest -c smoothy-${applicationSlug}`)
        }
    }

    private async createVolumes(k8sCoreV1Api: k8s.CoreV1Api, template: ParsedTemplate): Promise<void>
    {
        const volumes: Volume[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'volume') continue
            volumes.push(resource)
        }

        for(const volume of volumes) {
            await k8sCoreV1Api.createNamespacedPersistentVolumeClaim('default', {
                metadata: {
                    name: volume.id
                },
                spec: {
                    resources: {
                        requests: {
                            storage: '1Gi',
                        }
                    }
                }
            })
        }
    }

    private async createConfigFiles(k8sCoreV1Api: k8s.CoreV1Api, template: ParsedTemplate): Promise<void>
    {
        const configFiles: ConfigFile[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'config_file') continue
            configFiles.push(resource)
        }

        for(const configFile of configFiles) {
            await k8sCoreV1Api.createNamespacedConfigMap('default', {
                metadata: {
                    name: configFile.id
                },
                data: {
                    contents: configFile.contents,
                }
            })
        }
    }

    private async createStatelessSets(
        k8sCoreV1Api: k8s.CoreV1Api, k8sAppsV1Api: k8s.AppsV1Api, template: ParsedTemplate
    ): Promise<void>
    {
        const statelessSets: StatelessSet[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'stateless_set') continue
            statelessSets.push(resource)
        }

        for(const statelessSet of statelessSets) {
            const containers: k8s.V1Container[] = []
            let volumes: k8s.V1Volume[] = []

            for(const container of statelessSet.containers) {
                containers.push(await this.parseContainers(k8sCoreV1Api, container))
                volumes = volumes.concat(await this.parseVolumes(container))
            }

            await k8sAppsV1Api.createNamespacedDeployment('default', {
                metadata: {
                    name: statelessSet.id
                },
                spec: {
                    selector: {
                        matchLabels: {
                            'smoothy/managed-by': statelessSet.id,
                        }
                    },
                    replicas: 1,
                    strategy: {
                        type: 'RollingUpdate'
                    },
                    template: {
                        metadata: {
                            labels: {
                                'smoothy/managed-by': statelessSet.id,
                            }
                        },
                        spec: {
                            containers: containers,
                            restartPolicy: 'Always',
                            volumes: volumes,
                        }
                    }
                }
            })
        }
    }

    private async createCronJobs(
        k8sCoreV1Api: k8s.CoreV1Api, k8sBatchV1Api: k8s.BatchV1Api, template: ParsedTemplate
    ): Promise<void>
    {
        const cronJobs: CronJob[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'cron_job') continue
            cronJobs.push(resource)
        }

        for(const cronJob of cronJobs) {
            const containers: k8s.V1Container[] = []
            let volumes: k8s.V1Volume[] = []

            for(const container of cronJob.containers) {
                containers.push(await this.parseContainers(k8sCoreV1Api, container))
                volumes = volumes.concat(await this.parseVolumes(container))
            }

            await k8sBatchV1Api.createNamespacedJob('default', {
                metadata: {
                    name: cronJob.id
                },
                spec: {
                    template: {
                        metadata: {
                            labels: {
                                'smoothy/managed-by': `${cronJob.id}`,
                            }
                        },
                        spec: {
                            containers: containers,
                            restartPolicy: 'Never',
                            volumes: volumes,
                        }
                    }
                }
            })
        }
    }

    private async createJobs(
        k8sCoreV1Api: k8s.CoreV1Api, k8sBatchV1Api: k8s.BatchV1Api, template: ParsedTemplate
    ): Promise<void>
    {
        const jobs: Job[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'job') continue
            jobs.push(resource)
        }

        for(const job of jobs) {
            const containers: k8s.V1Container[] = []
            let volumes: k8s.V1Volume[] = []

            for(const container of job.containers) {
                containers.push(await this.parseContainers(k8sCoreV1Api, container))
                volumes = volumes.concat(await this.parseVolumes(container))
            }

            await k8sBatchV1Api.createNamespacedJob('default', {
                metadata: {
                    name: job.id
                },
                spec: {
                    template: {
                        metadata: {
                            labels: {
                                'smoothy/managed-by': job.id,
                            }
                        },
                        spec: {
                            containers: containers,
                            restartPolicy: 'Never',
                            volumes: volumes,
                        }
                    }
                }
            })
        }
    }

    private async parseContainers(k8sCoreV1Api: k8s.CoreV1Api, container: Container): Promise<k8s.V1Container>
    {
        const volumeMounts = (container.volume_mounts ?? []).map((volumeMount): k8s.V1VolumeMount => {
            return {
                name: volumeMount.volume,
                mountPath: volumeMount.mount_path
            }
        });

        const configFileMounts = (container.config_file_mounts ?? []).map((configFileMount): k8s.V1VolumeMount => {
            return {
                name: configFileMount.config_file,
                mountPath: configFileMount.mount_path,
            }
        });

        const environmentVariables = (container.environment ?? []).map((environmentVariable): k8s.V1EnvVar => {                
            return {
                name: environmentVariable.name,
                valueFrom: {
                    secretKeyRef: {
                        name: `${container.id}-environment`,
                        key: environmentVariable.name,
                    }
                },
            }
        });

        await k8sCoreV1Api.createNamespacedSecret('default', {
            metadata: {
                name: `${container.id}-environment`,
            },
            data: (container.environment ?? []).reduce((map: Record<string, string>, environmentVariable) => {
                map[environmentVariable.name] = Base64.encode(`${environmentVariable.value}`)
                return map;
            }, {})
        });

        return {
            name: container.name,
            image: container.image,
            imagePullPolicy: 'IfNotPresent',
            command: container.command ?? [],
            volumeMounts: [...volumeMounts, ...configFileMounts],
            tty: true,
            env: environmentVariables,
            resources: {
                requests: {
                    cpu: `${container.cpus.min}m`,
                    memory: `${container.memory.min}Mi`,
                },
                limits: {
                    cpu: `${container.cpus.max}m`,
                    memory: `${container.memory.max}Mi`,
                }
            }
        }
    }

    private parseVolumes(container: Container): k8s.V1Volume[]
    {
        const volumeMounts = (container.volume_mounts ?? []).map((volumeMount): k8s.V1Volume => {
            return {
                name: volumeMount.volume,
                persistentVolumeClaim: {
                    claimName: volumeMount.volume
                }
            }
        });

        const configFileMounts = (container.config_file_mounts ?? []).map((configFileMount): k8s.V1Volume  => {
            return {
                name: configFileMount.config_file,
                configMap: {
                    name: configFileMount.config_file
                }
            }
        });

        return [...volumeMounts, ...configFileMounts];
    }

    private async createEntrypoints(k8sApi: k8s.CoreV1Api, template: ParsedTemplate): Promise<void>
    {
        const entrypoints: Entrypoint[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'entrypoint') continue
            entrypoints.push(resource)
        }

        for(const entrypoint of entrypoints) {
            await k8sApi.createNamespacedService('default', {
                metadata: {
                    name: entrypoint.id
                },
                spec: {
                    type: 'NodePort',
                    selector: {
                        'smoothy/managed-by': entrypoint.target.id,
                    },
                    ports: [
                        {
                            protocol: entrypoint.protocol,
                            port: entrypoint.port,
                            nodePort: entrypoint.host_port
                        }
                    ]
                }
            })
        }
    }

    private async deleteCluster(applicationSlug: string): Promise<void>
    {
        await exec(`k3d cluster delete smoothy-${applicationSlug}`)
    }
}

export default InstallTemplate