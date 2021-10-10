FROM ghcr.io/apowers313/nhai-base:latest

COPY ./package.json /home/apowers
COPY ./package-lock.json /home/apowers
RUN npm install
ARG JUPYTER_FILE=unset
COPY $JUPYTER_FILE /home/apowers
COPY . /home/apowers

#COPY ./supervisord.conf /usr/local/etc/supervisord.conf
#CMD ["supervisord", "-c", "/usr/local/etc/supervisord.conf"]