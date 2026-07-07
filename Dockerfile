FROM n8nio/n8n:latest

USER root

RUN mkdir -p /home/node/n8n-custom/node_modules/n8n-nodes-nybrix-anonymisation && \
    chown -R node:node /home/node/n8n-custom

COPY --chown=node:node package.json /home/node/n8n-custom/node_modules/n8n-nodes-nybrix-anonymisation/package.json
COPY --chown=node:node dist/ /home/node/n8n-custom/node_modules/n8n-nodes-nybrix-anonymisation/dist/

USER node

ENV N8N_CUSTOM_EXTENSIONS=/home/node/n8n-custom
