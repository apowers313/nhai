FROM integration-test-base
COPY supervisord.conf /usr/local/etc/supervisord.conf
COPY supervisord-shutdown.sh /home/apowers/supervisord-shutdown.sh

# run server
CMD ["supervisord", "-c", "/usr/local/etc/supervisord.conf"]