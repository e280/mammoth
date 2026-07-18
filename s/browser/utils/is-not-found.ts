
export function isNotFound(error: unknown) {
	return error instanceof DOMException
		&& error.name === "NotFoundError"
}

