/*
 * Template
 */

export interface ImportedTemplate {
    details: PrivateTemplateDetails
    versions: Record<string, PrivateTemplate>
}

export interface PrivateTemplateDetails {
    cloud_service_type: "docker_server" | "kubernetes_cluster";
    meta: Record<string, any>;
    versions: string[];
    private?: boolean;
    template_name?: string;
    path?: string;
}

export interface PrivateTemplate extends ParsedTemplate {
    template_name: string;
    template_version: string;
}

export interface ParsedTemplate {
    template: TemplateSpec;
    files: TemplateFiles;
}

export interface TemplateSpec {
    deployment: Resource[]
    interface: Interface
}

export type TemplateFiles = Record<string, string>

/*
 * Variables
 */

export type Variables = Record<string, any>

/*
 * Resources
 */

export type Resource = Image | Volume | ConfigFile | StatelessSet | DaemonSet | Job | CronJob | Entrypoint

export interface Image {
    name: string;
    id: string;
    type: "image";
    dockerfile: string;
    code_repository: string;
    arguments: Argument[]
}

export interface Argument {
    name: string;
    value: any;
}

export interface Volume {
    name: string;
    id: string;
    access_modes: Array<string>;
    size: number;
    type: "volume";
}

export interface ConfigFile {
    name: string;
    id: string;
    type: "config_file";
    contents: string;
}

export interface CronJob {
    name: string;
    id: string;
    type: "cron_job";
    schedule: string;
    retries: number|null;
    timeout: number|null;
    containers: Container[];
}

export interface Job {
    name: string;
    id: string;
    type: "job";
    retries: number|null;
    timeout: number|null;
    containers: Container[];
}

export interface StatelessSet {
    name: string;
    id: string;
    type: "stateless_set";
    replicas: number;
    update_strategy: "recreate"|"rolling_update";
    containers: Container[];
}

export interface DaemonSet {
    name: string;
    id: string;
    type: "daemon_set";
    containers: Container[];
}

export interface Container {
    name: string;
    id: string;
    type: "container";
    image: string;
    command?: string[];
    environment?: EnvironmentVariable[];
    volume_mounts?: VolumeMount[];
    config_file_mounts?: ConfigFileMount[];
    cpus: ComputeResource;
    memory: ComputeResource;
}

export interface ComputeResource {
    min: number;
    max: number;
}

export interface EnvironmentVariable {
    name: string;
    value: any;
}

export interface VolumeMount {
    volume: string;
    mount_path: string;
}

export interface ConfigFileMount {
    config_file: string;
    mount_path: string;
}

export interface Entrypoint {
    name: string;
    id: string;
    type: "entrypoint";
    alias: string|null;
    description: string|null;
    target: EntrypointTarget;
    protocol: "TCP"|"UDP";
    port: number;
    host_port?: number;
}

interface EntrypointTarget {
    type: "stateless_set"|"stateful_set";
    id: string;
}

/*
 * Interfaces
 */

export interface Interface {
    logs?: LogInterface[]
    volumes?: VolumeInterface[]
}

export interface LogInterface {
    //
}

export interface VolumeInterface {
    //
}

/*
 * Cloud services
 */

export interface CloudService {
    install(): Promise<void>;
}