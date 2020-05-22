set -ev
echo TAG: $TRAVIS_TAG


zip -r whiteboard.zip ./dist
curl -v -F r=releases -F hasPom=false -F e=zip -F g=com.easemob.im.fe.rs -F a=whiteboard-web -F v=$TRAVIS_TAG -F p=zip -F file=@whiteboard.zip -u ci-deploy:Xyc-R5c-SdS-2Qr http://hk.nexus.op.easemob.com/nexus/service/local/artifact/maven/content
