import os
a=os.read
c='[%11c\n'%']'*99+a(0,91)
for o,p in a(0,99).split():
 o=map(ord,'  !  !  !!. -"!-"-: :-.:..; ;./G')[ord(o)*7%12::8];p=int(p)-31
 while'!'>max(c[p+o+13]for o in o):p+=13
 for o in o:c=c[:p+o]+'#'+c[p+o+1:]
 c=c.replace('[##########]\n','')
print c[-91:],1060-10*len(c)/13