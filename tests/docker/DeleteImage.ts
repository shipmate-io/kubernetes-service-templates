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
        const dockerImages: Docker.ImageInfo[] = await this.docker.listImages()
        
        const imageExists: boolean = dockerImages.flatMap(image => image.RepoTags).includes(`${image.id}:latest`)

        if(! imageExists) return

        const dockerImage: Docker.Image = this.docker.getImage(image.id)
        
        await dockerImage.remove()
    }
}

export default DeleteImage