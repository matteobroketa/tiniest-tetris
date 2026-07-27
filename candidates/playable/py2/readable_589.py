from curses import*
def f(s):
 r=range;b=[0]*20+[1023]*4;n=1;p=15;x=3;y=0;s.timeout(99)
 def C(x,y,p):return x<0 or any((b[y+i]|-1024)>>x&p>>i*4&15for i in r(4))
 while C(x,y,p)<1:
  B=b[:]
  for i in r(4):B[y+i]|=(p>>i*4&15)<<x
  s.addstr(0,0,'\n'.join(''.join(' #'[v>>X&1]for X in r(10))for v in B[:20]))
  k=s.getch()-98;q=k and p or sum((p>>i&1)<<(4*i+3)%17for i in r(16))
  X=x+k*(k%2)
  if C(X,y,q)==0:x,p=X,q
  if C(x,y+1,p):
   for i in r(4):b[y+i]|=(p>>i*4&15)<<x
   b=[v for v in b if v<1023];b=[0]*(20-len(b))+b+[1023]*4;p=ord("3'qt6c"[n%7]);n+=1;x=3;y=0
  else:y+=1
wrapper(f)