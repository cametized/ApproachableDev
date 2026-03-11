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

updateTransform()

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
canvas.addEventListener("pointerleave",endDraw)

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

function setTool(t){tool=t}

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

layers[activeLayer].ctx.beginPath()
layers[activeLayer].ctx.moveTo(startX,startY)

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

if(!drawing) return
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

}

function updateTransform(){

wrapper.style.transform=
`translate(${offsetX}px,${offsetY}px) scale(${zoom})`

}

function setZoom(z){

zoom=Math.max(.2,Math.min(10,z))
updateTransform()

}

document.getElementById("zoomIn").onclick=()=>setZoom(zoom*1.2)
document.getElementById("zoomOut").onclick=()=>setZoom(zoom/1.2)

wrapper.addEventListener("wheel",e=>{

e.preventDefault()

const delta=e.deltaY<0?1.1:.9

setZoom(zoom*delta)

})

let spaceHeld=false
let dragging=false

document.addEventListener("keydown",e=>{

if(e.code==="Space") spaceHeld=true

if(e.ctrlKey && e.key==="z"){e.preventDefault();undo()}
if(e.ctrlKey && e.key==="y"){e.preventDefault();redo()}
if(e.ctrlKey && e.key==="s"){e.preventDefault();saveProject()}
if(e.ctrlKey && e.key==="o"){e.preventDefault();document.getElementById("loadProject").click()}

})

document.addEventListener("keyup",e=>{
if(e.code==="Space") spaceHeld=false
})

wrapper.addEventListener("pointerdown",e=>{

if(spaceHeld){

dragging=true
startX=e.clientX
startY=e.clientY

}

})

wrapper.addEventListener("pointermove",e=>{

if(!dragging) return

offsetX+=e.clientX-startX
offsetY+=e.clientY-startY

updateTransform()

startX=e.clientX
startY=e.clientY

})

wrapper.addEventListener("pointerup",()=>dragging=false)

function saveProject(){

const project={
type:"draw-project",
width:WIDTH,
height:HEIGHT,
layers:[]
}

layers.forEach(l=>{
project.layers.push(l.canvas.toDataURL())
})

const blob=new Blob(
[JSON.stringify(project)],
{type:"application/draw"}
)

const link=document.createElement("a")
link.href=URL.createObjectURL(blob)
link.download="project.draw"
link.click()

}

document.getElementById("saveProject").onclick=saveProject

document.getElementById("loadProject").addEventListener("change",function(e){

const file=e.target.files[0]
if(!file) return

const reader=new FileReader()

reader.onload=function(){

const project=JSON.parse(reader.result)

if(project.type!=="draw-project"){
alert("Invalid file")
return
}

container.innerHTML=""
layers=[]

initCanvas(project.width,project.height)

project.layers.forEach((data,i)=>{

if(i>0) createLayer()

const img=new Image()

img.onload=function(){
layers[i].ctx.drawImage(img,0,0)
}

img.src=data

})

}

reader.readAsText(file)

})

document.getElementById("download").onclick=function(){

const exportCanvas=document.createElement("canvas")
exportCanvas.width=WIDTH
exportCanvas.height=HEIGHT

const ctx=exportCanvas.getContext("2d")

layers.forEach(l=>{
ctx.drawImage(l.canvas,0,0)
})

const link=document.createElement("a")
link.download="image.png"
link.href=exportCanvas.toDataURL()

link.click()

}

document.getElementById("darkToggle").onclick=function(){

document.body.classList.toggle("dark")

localStorage.setItem(
"darkMode",
document.body.classList.contains("dark")
)

}

if(localStorage.getItem("darkMode")==="true")
document.body.classList.add("dark")

document.getElementById("addLayer").onclick=createLayer

document.getElementById("createCanvas").onclick=function(){

const w=parseInt(document.getElementById("newWidth").value)
const h=parseInt(document.getElementById("newHeight").value)

document.getElementById("startup").style.display="none"

initCanvas(w,h)

}