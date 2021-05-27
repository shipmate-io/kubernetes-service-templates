import Template from './Template'

export { Template };

export async function sleep(seconds: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000 * seconds))
}