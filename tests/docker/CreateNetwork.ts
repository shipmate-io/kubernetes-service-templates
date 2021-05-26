import Docker from 'dockerode'

class CreateNetwork
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(name: string): Promise<void>
    {
        const dockerNetworks: Docker.NetworkInspectInfo[] = await this.docker.listNetworks()

        const networkExists: boolean = dockerNetworks.map(network => network.Name).includes(name)

        if(networkExists) return

        await this.docker.createNetwork({ Name: name })
    }
}

export default CreateNetwork