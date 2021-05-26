#####################################
# BUILD ASSETS
#####################################

{% if variable.build_assets %}
FROM node:alpine as assets-stage

RUN mkdir -p {{ path('/app/', variable.path_to_source_code) }}
WORKDIR {{ path('/app/', variable.path_to_source_code) }}

{% if variable.package_manager == "npm" %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN npm install
{% elseif variable.package_manager == "yarn" %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('code-repository/', variable.path_to_source_code, '/yarn.*') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN yarn install
{% endif %}

COPY {{ path('code-repository/', variable.path_to_source_code, '/') }} {{ path('/app/', variable.path_to_source_code, '/') }}

{% for path_to_shared_library in variable.paths_to_shared_libraries %}
COPY {{ path('code-repository/', path_to_shared_library, '/') }}  {{ path('/app/', path_to_shared_library, '/') }}
{% endfor %}

{% for command in variable.build_assets_script|trim|split('\n') %}
RUN {{ command }}
{% endfor %}
{% endif %}

#####################################
# CREATE NGINX CONTAINER
#####################################

FROM smoothy/nginx:1.19-1.0.0

{% if variable.build_assets %}
COPY --from=assets-stage {{ path('/app/', variable.path_to_source_code, '/public') }} {{ path('/var/www/', variable.path_to_source_code, '/public') }}
{% else %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/public') }} {{ path('/var/www/', variable.path_to_source_code, '/public') }}
{% endif %}

COPY --chown=smoothy:smoothy nginx/server.conf /etc/nginx/conf.d/server.conf

RUN rm -f {{ path('/var/www/', variable.path_to_source_code, '/public/storage/') }} \
 && ([ -d {{ path('/var/www/', variable.path_to_source_code, '/storage/app/public/') }} ] && ln -s {{ path('/var/www/', variable.path_to_source_code, '/storage/app/public/') }} {{ path('/var/www/', variable.path_to_source_code, '/public/storage/') }} || true)