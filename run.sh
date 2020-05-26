#!/bin/sh
meteor npm install

PACKAGE_DIRS="../lib:../liboauth"
USE_DYNAMIC_IMPORTS=1 METEOR_PACKAGE_DIRS=${PACKAGE_DIRS}  meteor --port=5050 --settings=settings.json
