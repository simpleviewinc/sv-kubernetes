export interface PodJson {
    items: [
        {
            metadata : {
                name: string,
                podIP : string,
                annotations : { [key: string]: string }
            },
            spec : {
                containers : [
                    {
                        name: string
                    }
                ]
            }
        }
    ]
}