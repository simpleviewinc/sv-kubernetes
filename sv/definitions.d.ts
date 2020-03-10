export interface PodJson {
	items: [
		{
			metadata : {
				name: string,
				annotations : { [key: string]: string }
			},
			podIP : string,
			spec : {
				containers : [
					{
						name: string
					}
				]
			},
			status : {
				phase : string
			}
		}
	]
}