FROM node:16.13.1

ARG SV_ENV
ARG VAR1
ARG VAR2
ARG VAR3

COPY name /tmp/name

RUN printf "{ \"env\" : \"$SV_ENV\", \"var1\" : \"$VAR1\", \"var2\" : \"$VAR2\", \"var3\" : \"$VAR3\" }" > /tmp/vars