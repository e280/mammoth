
export type Hash = string
export type Id = string

export type Bucket = {
	has(id: Id): Promise<boolean>
	size(id: Id): Promise<number>
	delete(id: Id): Promise<void>
	read(id: Id): Promise<Blob>
	write(id: Id, readable: ReadableStream<Uint8Array>): Promise<void>
}

export type Stats = {
	size: number
}

export type Wip = {
	created: number
}

