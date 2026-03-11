let WIDTH=1000
let HEIGHT=650

const container=document.getElementById("canvasContainer")
const wrapper=document.getElementById("canvasWrapper")

let zoom=1
let offsetX=0
let offsetY=0

let layers=[]
let activeLayer=0
let tool="brush"

let drawing=false
let startX=0
let startY=0

let undoStack=[]
let redoStack=[]

let previewCanvas
let previewCtx

const color=document.getElementById("colorPicker")
const size=document.getElementById("size")
const opacity=document.getElementById("opacity")

function initCanvas(w,h){

WIDTH=w
HEIGHT=h

container.style.width=w+"px"
container.style.height=h+"px"

previewCanvas=document.createElement("canvas")
previewCanvas.width=w
previewCanvas.height=h
previewCanvas.style.pointerEvents="none"

container.appendChild(previewCanvas)

previewCtx=previewCanvas.getContext("2d")

createLayer()

}

function createLayer(){

const canvas=document.createElement("canvas")
canvas.width=WIDTH
canvas.height=HEIGHT

container.appendChild(canvas)

const ctx=canvas.getContext("2d")

layers.push({canvas,ctx})

updateLayers()

canvas.addEventListener("pointerdown",startDraw)
canvas.addEventListener("pointermove",draw)
canvas.addEventListener("pointerup",endDraw)

}

function updateLayers(){

const ui=document.getElementById("layers")
ui.innerHTML=""

layers.forEach((l,i)=>{

const div=document.createElement("div")

div.className="layer"
div.innerText="Layer "+(i+1)

if(i===activeLayer)
div.classList.add("active")

div.onclick=()=>{

activeLayer=i
updateLayers()

}

ui.appendChild(div)

})

}

function setTool(t){ tool=t }

function getPos(e){

const rect=container.getBoundingClientRect()

return{
x:(e.clientX-rect.left)/zoom,
y:(e.clientY-rect.top)/zoom
}

}

function saveState(){

const snapshot=[]

layers.forEach(l=>{
snapshot.push(l.canvas.toDataURL())
})

undoStack.push(snapshot)
redoStack=[]

}

function restoreState(from,to){

if(from.length===0) return

const current=[]

layers.forEach(l=>{
current.push(l.canvas.toDataURL())
})

to.push(current)

const state=from.pop()

state.forEach((imgData,i)=>{

const img=new Image()

img.onload=function(){

layers[i].ctx.clearRect(0,0,WIDTH,HEIGHT)
layers[i].ctx.drawImage(img,0,0)

}

img.src=imgData

})

}

function undo(){restoreState(undoStack,redoStack)}
function redo(){restoreState(redoStack,undoStack)}

function startDraw(e){

if(spaceHeld) return

saveState()

drawing=true

const pos=getPos(e)

startX=pos.x
startY=pos.y

}

function draw(e){

if(!drawing) return

const pos=getPos(e)

const ctx=layers[activeLayer].ctx

ctx.lineWidth=size.value
ctx.globalAlpha=opacity.value/100
ctx.strokeStyle=color.value
ctx.fillStyle=color.value
ctx.lineCap="round"

previewCtx.clearRect(0,0,WIDTH,HEIGHT)

if(tool==="brush"){

ctx.lineTo(pos.x,pos.y)
ctx.stroke()

ctx.beginPath()
ctx.moveTo(pos.x,pos.y)

}

else if(tool==="eraser"){

ctx.clearRect(pos.x,pos.y,size.value,size.value)

}

else if(tool==="line"){

previewCtx.beginPath()
previewCtx.moveTo(startX,startY)
previewCtx.lineTo(pos.x,pos.y)
previewCtx.stroke()

}

else if(tool==="rect"){

previewCtx.strokeRect(startX,startY,pos.x-startX,pos.y-startY)

}

else if(tool==="circle"){

let r=Math.hypot(pos.x-startX,pos.y-startY)

previewCtx.beginPath()
previewCtx.arc(startX,startY,r,0,Math.PI*2)
previewCtx.stroke()

}

}

function endDraw(e){

drawing=false

const pos=getPos(e)

const ctx=layers[activeLayer].ctx

previewCtx.clearRect(0,0,WIDTH,HEIGHT)

if(tool==="line"){

ctx.beginPath()
ctx.moveTo(startX,startY)
ctx.lineTo(pos.x,pos.y)
ctx.stroke()

}

if(tool==="rect"){

ctx.strokeRect(startX,startY,pos.x-startX,pos.y-startY)

}

if(tool==="circle"){

let r=Math.hypot(pos.x-startX,pos.y-startY)

ctx.beginPath()
ctx.arc(startX,startY,r,0,Math.PI*2)
ctx.stroke()

}

ctx.beginPath()

}

document.getElementById("zoomIn").onclick=()=>setZoom(zoom*1.2)
document.getElementById("zoomOut").onclick=()=>setZoom(zoom/1.2)

function setZoom(z){

zoom=z
wrapper.style.transform=`scale(${zoom}) translate(${offsetX}px,${offsetY}px)`

}

let spaceHeld=false
let dragging=false

document.addEventListener("keydown",e=>{

if(e.code==="Space"){
spaceHeld=true
}

if(e.ctrlKey && e.key==="z"){
e.preventDefault()
undo()
}

if(e.ctrlKey && e.key==="y"){
e.preventDefault()
redo()
}

})

document.addEventListener("keyup",e=>{
if(e.code==="Space"){
spaceHeld=false
}
})

wrapper.addEventListener("pointerdown",e=>{

if(spaceHeld){

dragging=true
startX=e.clientX
startY=e.clientY

}

})

wrapper.addEventListener("pointermove",e=>{

if(dragging){

offsetX+=(e.clientX-startX)/zoom
offsetY+=(e.clientY-startY)/zoom

setZoom(zoom)

startX=e.clientX
startY=e.clientY

}

})

wrapper.addEventListener("pointerup",()=>dragging=false)

document.getElementById("createCanvas").onclick=function(){

const w=parseInt(document.getElementById("newWidth").value)
const h=parseInt(document.getElementById("newHeight").value)

document.getElementById("startup").style.display="none"

initCanvas(w,h)

}