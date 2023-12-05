# Files to use LetsEncrypt on Elastic Beanstalk (Amazon Linux 2023)

If you want to use Elastic Beanstalk's free tier with a single instance, you can use LetsEncrypt to get a free SSL certificate for your instances.
Placing these files inside the appropriate directories will let you automatically install a certificate with every deploy.

Inside of your code, you should have the following structure:

```
.
├── index.js
├── package-lock.json
├── package.json
├── .ebextensions
│   ├── 00_install_certbot.config
│   └── 10_open_https_port.config
└── .platform
    └── hooks
        └── postdeploy
            └── 00_get_certificate.sh
```

Credit to [Marcos Escandell](https://medium.com/edataconsulting/how-to-get-a-ssl-certificate-running-in-aws-elastic-beanstalk-using-certbot-6daa9baa3997) for the Amazon Linux 2 instructions that led me to here.