#####################################
# SET UP PHP ENVIRONMENT
#####################################

{% if variable.php_version == "7.4" %}
FROM smoothy/php-fpm:7.4-1.0.0 AS php-stage
{% endif %}

ENV APPLICATION_ROOT {{ path('/var/www', variable.path_to_source_code, '/public') }}

{% if variable.additional_software_script|length > 0 %}
RUN apt-get update \
{% for command in variable.additional_software_script|split('\n')|filter(command => command) %}
 && ({{ command }}) \
{% endfor %}
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
{% endif %}

#####################################
# BUILD ASSETS
#####################################

{% if variable.build_assets %}
FROM node:alpine AS assets-stage

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
# ADD PHP CODE
#####################################

FROM php-stage AS production-stage

{% if variable.release_script %}
COPY --chown=smoothy:smoothy php/init.sh /scripts/init.sh
{% endif %}

RUN chmod -R 775 /scripts

COPY --chown=smoothy:smoothy php/run.sh /entrypoints/run.sh
COPY --chown=smoothy:smoothy {{ path('code-repository/', variable.path_to_source_code, '/') }} {{ path('/var/www', variable.path_to_source_code, '/') }}

{% for path_to_shared_library in variable.paths_to_shared_libraries %}
COPY --chown=smoothy:smoothy {{ path('code-repository/', path_to_shared_library, '/') }} {{ path('/var/www', path_to_shared_library, '/') }}
{% endfor %}

RUN chmod -R 775 {{ path('/var/www/', variable.path_to_source_code, '/storage') }} \
 && chmod -R 775 {{ path('/var/www/', variable.path_to_source_code, '/bootstrap/cache') }}

{% if variable.build_assets %}
COPY --chown=smoothy:smoothy --from=assets-stage {{ path('/app/', variable.path_to_source_code, '/public') }} {{ path('/var/www/', variable.path_to_source_code, '/public') }}
{% endif %}

WORKDIR {{ path('/var/www/', variable.path_to_source_code) }}

{% for private_composer_registry in variable.private_composer_registries %}
ARG PRIVATE_COMPOSER_REGISTRY_URL_{{ loop.key }}
ARG PRIVATE_COMPOSER_REGISTRY_USERNAME_{{ loop.key }}
ARG PRIVATE_COMPOSER_REGISTRY_PASSWORD_{{ loop.key }}
RUN composer config $PRIVATE_COMPOSER_REGISTRY_URL_{{ loop.key }} $PRIVATE_COMPOSER_REGISTRY_USERNAME_{{ loop.key }} $PRIVATE_COMPOSER_REGISTRY_PASSWORD_{{ loop.key }}
{% endfor %}

RUN composer install --ignore-platform-reqs --no-dev --no-interaction --prefer-dist
