FROM node:alpine as build-stage

{% for name, value in environment %}
ARG {{ name }}
{% endfor %}

RUN mkdir -p {{ path('/app/', variable.path_to_source_code) }}
WORKDIR {{ path('/app/', variable.path_to_source_code) }}

{% if variable.package_manager == 'npm' %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN npm install --silent
{% elseif variable.package_manager == 'yarn' %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('code-repository/', variable.path_to_source_code, '/yarn.*') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN yarn install --silent
{% endif %}

COPY {{ path('code-repository/', variable.path_to_source_code, '/') }} {{ path('/app/', variable.path_to_source_code, '/') }}

{% for path_to_shared_library in variable.paths_to_shared_libraries %}
COPY {{ path('code-repository/', path_to_shared_library, '/') }}  {{ path('/app/', path_to_shared_library, '/') }}
{% endfor %}

{% for command in variable.build_script|trim|split('\n') %}
RUN {{ command }}
{% endfor %}

FROM smoothy/nginx:1.19-1.0.0

COPY server.conf /etc/nginx/conf.d/server.conf
COPY --from=build-stage {{ path('/app/', variable.path_to_source_code, variable.path_to_built_source_code) }} /usr/share/nginx/html
