FROM europe-west3-docker.pkg.dev/smoothy-171414/base-images/nginx/1.19:1.0.2

# Copy the nginx configuration into the image.
COPY server.conf /etc/nginx/conf.d/server.conf

# Copy the source code of the service into the image.
COPY {{ path('code-repository', variable.path_to_source_code) }} {{ path('/usr/share/nginx/html', variable.path_to_source_code) }}
