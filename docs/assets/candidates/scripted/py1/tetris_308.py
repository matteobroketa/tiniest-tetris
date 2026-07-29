import os
r=os.read
b='[%11c\n'%']'*99+r(0,91)
for k,p in r(0,99).split():
 k='IJLOSTZ'.find(k)*4;o=map(ord,' -:G!.:; -:; !-.!"-. !". !./'[k:k+4]);p=int(p)-31
 while'!'>max(map(lambda x:b[p+x+13],o)):p=p+13
 for x in o:b=b[:p+x]+'#'+b[p+x+1:]
 b=b.replace('[##########]\n','')
print b[-91:],1060-10*len(b)/13