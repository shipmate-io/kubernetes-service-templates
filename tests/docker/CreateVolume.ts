import Docker from 'dockerode'
import { Volume } from '@/types'

class CreateVolume
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(volume: Volume)
    {
        const docker_volumes: Docker.VolumeInspectInfo[] = (await this.docker.listVolumes()).Volumes

        const volume_exists: boolean = docker_volumes.map(volume => volume.Name).includes(volume.id)

        if(volume_exists) return

        await this.docker.createVolume({ Name: volume.id })
    }
}

export default CreateVolume