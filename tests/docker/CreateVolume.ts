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
        const dockerVolumes: Docker.VolumeInspectInfo[] = (await this.docker.listVolumes()).Volumes

        const volumeExists: boolean = dockerVolumes.map(volume => volume.Name).includes(volume.id)

        if(volumeExists) return

        await this.docker.createVolume({ Name: volume.id })
    }
}

export default CreateVolume