#!/bin/bash

#####################################
# init Laravel application
#####################################

{% for command in variable.release_script|trim|split('\n') %}
{{ command }}
{% endfor %}