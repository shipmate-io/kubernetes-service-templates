import Docker from 'dockerode'
import { Volume } from '@/types'

class DeleteVolume
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(volume: Volume)
    {
        const docker_volumes: Docker.VolumeInspectInfo[] = (await this.docker.listVolumes()).Volumes

        const volume_exists: boolean = docker_volumes.map(volume => volume.Name).includes(volume.id)

        if(! volume_exists) return

        const docker_volume: Docker.Volume = this.docker.getVolume(volume.id)

        await docker_volume.remove()
    }
}

export default DeleteVolume