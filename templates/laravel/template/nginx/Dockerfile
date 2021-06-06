# Build the JavaScript and CSS assets, if specified.
{% if variable.build_assets %}
FROM node:alpine as assets-stage

# Create the directory to copy to Laravel source code to.
RUN mkdir -p {{ path('/app/', variable.path_to_source_code) }}

# CD into the directory.
WORKDIR {{ path('/app/', variable.path_to_source_code) }}

# Copy the locked JavaScript dependency manifest into the directory and install the dependencies using the specified package manager.
{% if variable.package_manager == "npm" %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN npm install
{% elseif variable.package_manager == "yarn" %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/package*.json') }} {{ path('code-repository/', variable.path_to_source_code, '/yarn.*') }} {{ path('/app/', variable.path_to_source_code, '/') }}
RUN yarn install
{% endif %}

# Copy the source code of the service into the directory.
COPY {{ path('code-repository/', variable.path_to_source_code, '/') }} {{ path('/app/', variable.path_to_source_code, '/') }}

# Copy the source code of the shared libraries into the directory.
{% for path_to_shared_library in variable.paths_to_shared_libraries %}
COPY {{ path('code-repository/', path_to_shared_library, '/') }}  {{ path('/app/', path_to_shared_library, '/') }}
{% endfor %}

# Run the specified build assets script.
{% for command in variable.build_assets_script|trim|split('\n') %}
RUN {{ command }}
{% endfor %}
{% endif %}

# Switch to the nginx image.
FROM smoothy/nginx:1.19-1.0.0

# Copy the nginx configuration into the image.
COPY --chown=smoothy:smoothy nginx/server.conf /etc/nginx/conf.d/server.conf

# Copy the source code of the service into the image.
{% if variable.build_assets %}
COPY --from=assets-stage {{ path('/app/', variable.path_to_source_code, '/public') }} {{ path('/var/www/', variable.path_to_source_code, '/public') }}
{% else %}
COPY {{ path('code-repository/', variable.path_to_source_code, '/public') }} {{ path('/var/www/', variable.path_to_source_code, '/public') }}
{% endif %}