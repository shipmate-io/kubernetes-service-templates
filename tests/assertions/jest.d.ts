declare global {
    namespace jest {
        interface Matchers<R> {
            async toHaveValidSyntax(): R
            async toFailDueToIncorrectFormInput(expectedExceptions: Record<string, string[]>): R
            async toSucceed(): R
            async toMatchParsedTemplate(pathToParsedTemplate: string): R
        }
    }
}
  
export {};