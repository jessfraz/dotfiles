FROM alpine:3.11.2

RUN apk add --no-cache \
	nodejs \
	git \
	openssh-client \
	docker-cli \
	bash \
	;
