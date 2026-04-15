class OperatorOverloaderWrapper {
    constructor(object) {
        self.object = new Proxy(object, {
            set(obj, prop, value) {
                
            }
        } )
    }
}