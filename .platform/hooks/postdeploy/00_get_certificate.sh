#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d Intex23.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email jassinfosystems@gmail.com

sudo certbot -n -d mental.health.provo.is404.net --nginx --agree-tos --email jassinfosystems@gmail.com
