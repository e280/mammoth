
export type Hash = string
export type Id = string

/** file blob store. */
export type Bucket = {
	has(id: Id): Promise<boolean>
	size(id: Id): Promise<number>
	delete(id: Id): Promise<void>
	read(id: Id): Promise<Blob>
	write(id: Id, readable: ReadableStream<Uint8Array>): Promise<void>
}

export type Stats = {

	/** total number of bytes in the whole datalake. */
	size: number

	/** total number of known files in the datalake. */
	count: number
}

export type Wip = {
	created: number
}

