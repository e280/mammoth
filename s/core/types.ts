
export type Hash = string
export type Id = string

export type Iceberg = {
	has(id: Id): Promise<boolean>
	size(id: Id): Promise<number>
	delete(id: Id): Promise<void>
	read(id: Id): Promise<Blob>
	write(id: Id, readable: ReadableStream<Uint8Array>): Promise<void>
}

export type Glacier = {
	has(hash: Hash): Promise<boolean>
	size(hash: Hash): Promise<number>
	read(hash: Hash): Promise<Blob>
	delete(hash: Hash): Promise<void>
	write(readable: ReadableStream<Uint8Array>): Promise<Hash>
	keys(): AsyncIterable<Hash>
}

