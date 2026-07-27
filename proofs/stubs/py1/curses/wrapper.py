import os,sys

class _Screen:
 def __init__(self,seed=0):
  self.mode=os.environ.get('TETRIS_MODE','proof')
  self.index=0;self.frames=0;self.previous=-1;self.clear_events=0;self.checksum=1
  if self.mode=='proof':
   path=os.environ.get('TETRIS_KEYS','proofs/vectors/playable_keys.txt')
   self.keys=map(int,open(path).read().split())
  else:
   self.keys=[]
   if seed:self.state=seed
   else:self.state=int(os.environ.get('TETRIS_SEED','1'))
 def timeout(self,value):
  if value!=99:raise AssertionError('timeout')
 def addstr(self,x,y,frame):
  lines=frame.split('\n')
  if len(lines)!=20:raise AssertionError('height')
  for line in lines:
   if len(line)!=10:raise AssertionError('width')
   for char in line:
    if char not in ' #':raise AssertionError('cell')
  filled=frame.count('#')
  if self.previous>=0 and filled<self.previous:self.clear_events=self.clear_events+1
  self.previous=filled;self.frames=self.frames+1
  if self.frames>10000:raise AssertionError('frame limit')
  for char in frame:self.checksum=(self.checksum*1000003+ord(char))%4294967291L
 def getch(self):
  if self.mode=='proof':
   if self.index<len(self.keys):
    key=self.keys[self.index];self.index=self.index+1;return key
   return -1
  self.state=(1103515245*self.state+12345)%2147483648L;self.index=self.index+1
  return (-1,97,98,99)[int(self.state>>16&3)]

def wrapper(function):
 if os.environ.get('TETRIS_MODE')=='random-suite':
  total=clears=0;digest=1
  for seed in range(1,33):
   screen=_Screen(seed);function(screen);total=total+screen.frames;clears=clears+screen.clear_events;digest=(digest*1000003+screen.checksum)%4294967291L
  if (total,clears,digest)!=(5298,1,2583409795L):raise AssertionError('random suite mismatch')
  sys.stdout.write('PLAYABLE_RANDOM_SUITE games=32 frames=%d clears=%d checksum=%d\n'%(total,clears,digest));return
 screen=_Screen();function(screen)
 if screen.mode=='proof':
  if (screen.frames,screen.clear_events,screen.checksum,screen.index)!=(477,6,4287608623L,400):
   raise AssertionError('trace mismatch')
 sys.stdout.write('PLAYABLE_PROOF mode=%s frames=%d clears=%d checksum=%d keys=%d\n'%(screen.mode,screen.frames,screen.clear_events,screen.checksum,screen.index))
