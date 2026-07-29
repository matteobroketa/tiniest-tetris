import os
a=os.read
c=bytearray(b'[%11c\n'%93*99+a(0,91))
for o,p in a(0,99).split():
 o=b'  !  !  !!. -"!-"-: :-.:..; ;./G'[o*7%12::8];p-=79
 while 33>max(c[p+o+13]for o in o):p+=13
 for o in o:c[p+o]=35
 c=c.replace(b'[##########]\n',b'')
os.write(1,c[-91:]+b'%d'%(1060-10*len(c)//13))