FROM smoothy/nginx:1.19-1.0.0

COPY server.conf /etc/nginx/conf.d/server.conf
COPY code-repository/{{ variable.path_to_source_code|trim('/') }} /usr/share/nginx/html/{{ variable.path_to_source_code|trim('/') }}
