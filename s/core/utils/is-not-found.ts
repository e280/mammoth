
export function isNotFoundErr(error: unknown) {
	return error instanceof DOMException
		&& error.name === "NotFoundError"
}

