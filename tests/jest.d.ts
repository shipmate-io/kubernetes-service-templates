declare global {
    namespace jest {
        interface Matchers<R> {
            async toHaveValidSyntax(): R
        }
    }
}
  
export {};