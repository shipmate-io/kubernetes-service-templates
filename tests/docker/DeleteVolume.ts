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
        const dockerVolumes: Docker.VolumeInspectInfo[] = (await this.docker.listVolumes()).Volumes

        const volumeExists: boolean = dockerVolumes.map(volume => volume.Name).includes(volume.id)

        if(! volumeExists) return

        const dockerVolume: Docker.Volume = this.docker.getVolume(volume.id)

        await dockerVolume.remove()
    }
}

export default DeleteVolume