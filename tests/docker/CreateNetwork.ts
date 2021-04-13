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
        const docker_networks: Docker.NetworkInspectInfo[] = await this.docker.listNetworks()

        const network_exists: boolean = docker_networks.map(network => network.Name).includes(name)

        if(network_exists) return

        await this.docker.createNetwork({ Name: name })
    }
}

export default CreateNetwork