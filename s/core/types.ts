
export type Hash = string
export type Id = string

/** file blob store. */
export type Bucket = {
	has(id: Id): Promise<boolean>
	delete(id: Id): Promise<void>
	read(id: Id): Promise<Blob>
	write(id: Id, readable: ReadableStream<Uint8Array>): Promise<void>
}

/** report about a file */
export type Analysis = {

	/** blake3 hash of the file's contents */
	hash: Hash

	/** filesize in bytes */
	size: number
}

/** metadata for a single file. */
export type Info = {

	/** bucket id for this file's data. */
	id: Id

	/** filesize in bytes. */
	size: number

	/** when this file was added to the datalake. */
	added: number
}

/** statistics for the whole datalake. */
export type Stats = {

	/** total number of bytes in the whole datalake. */
	size: number

	/** total number of files in the datalake. */
	count: number
}

export type Wip = {
	created: number
}

