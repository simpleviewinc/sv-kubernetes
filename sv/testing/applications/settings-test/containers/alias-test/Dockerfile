FROM node:16.13.1

ARG SV_ENV

COPY --from=ctx_src env /tmp/ctx_env
COPY name /tmp/name

RUN . /tmp/ctx_env && printf "{ \"env\" : \"$SV_ENV\", \"context_name\" : \"$CONTEXT_NAME\" }" > /tmp/vars
