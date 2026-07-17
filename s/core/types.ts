
export type Hash = string
export type RandomId = string

export type Glacier = {
	has(hash: Hash): Promise<boolean>
	size(hash: Hash): Promise<number>
	read(hash: Hash): Promise<Blob>
	delete(hash: Hash): Promise<void>
	write(readable: ReadableStream<Uint8Array>): Promise<Hash>
	keys(): AsyncIterable<Hash>
}

