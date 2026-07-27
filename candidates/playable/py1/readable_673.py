from curses.wrapper import*
r=range
def C(x,y,p):return x<0 or max(map(lambda i:(b[y+i]|-1024)>>x&p>>i*4&15,r(4)))
def R(p):return reduce(lambda q,i:q+((p>>i&1)<<((4*i+3)%17)),r(16),0)
def f(s):
 global b
 b=[0]*20+[1023]*4;n=1;p=15;x=3;y=0;s.timeout(99)
 while C(x,y,p)<1:
  B=b[:]
  for i in r(4):B[y+i]=B[y+i]|(p>>i*4&15)<<x
  s.addstr(0,0,'\n'.join(map(lambda v:''.join(map(lambda X:' #'[v>>X&1],r(10))),B[:20])))
  k=s.getch()-98;q=k and p or R(p);X=x+k*(k%2)
  if not C(X,y,q):x=X;p=q
  if C(x,y+1,p):
   for i in r(4):b[y+i]=b[y+i]|(p>>i*4&15)<<x
   b=filter(lambda v:v<1023,b);b=[0]*(20-len(b))+b+[1023]*4;p=ord("3'qt6c"[n%7]);n=n+1;x=3;y=0
  else:y=y+1
wrapper(f)