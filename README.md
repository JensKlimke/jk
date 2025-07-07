# JK Server Infrastructure


## Server

- V-Host with static IP and DNS entry (domain: marlene.cloud)
- Ubuntu 24.04.2 LTS (GNU/Linux 6.8.0-63-generic x86_64)
- SSH root access via certificate

### Preparation

Install k3s with disabled traefik and local balancer:

```
curl -sfL https://get.k3s.io | sh -s - --disable=traefik --disable servicelb
```

Copy the config (e.g. by using cat), replace the server name by the domain and add the content to your local ```~/.kube/config``` file

```
sudo cat /etc/rancher/k3s/k3s.yaml
```

Now you are able to work on your server with ```kubectl``` from your local machine.

