# Générateur de références juridiques

Micro-application de génération d'identifiants compacts pour dossiers juridiques.

## Installation

```
npm install
```

## Tests

```
npm test
```

## Construction

```
npm run build
```

## CLI

Le script `genref` lit les options et utilise la variable d'environnement `SECRET_SALT`.

```
SECRET_SALT=s3cr3t npm run build
node dist/src/cli.js --type M --date 2025-08-14 --juridiction CH-BS --canal WEB
```

## Web

Après `npm run build`, ouvrir `dist/web/index.html` dans un navigateur moderne. Le sel secret est demandé lors du chargement de la page. L'historique est conservé dans `localStorage`.
