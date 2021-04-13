import Docker from 'dockerode'
import { Image } from '@/types'

class DeleteImage
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(image: Image): Promise<void>
    {
        const docker_images: Docker.ImageInfo[] = await this.docker.listImages()
        
        const image_exists: boolean = docker_images.flatMap(image => image.RepoTags).includes(`${image.id}:latest`)

        if(! image_exists) return

        const docker_image: Docker.Image = this.docker.getImage(image.id)
        
        await docker_image.remove()
    }
}

export default DeleteImage