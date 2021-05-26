#!/bin/bash

#####################################
# prepare Laravel application
#####################################

{% for command in variable.deploy_script|trim|split('\n') %}
{{ command }}
{% endfor %}