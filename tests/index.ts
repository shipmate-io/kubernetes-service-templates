import Template from './Template'
import Service from './Service'

export { Template, Service };

export async function sleep(seconds: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000 * seconds))
}