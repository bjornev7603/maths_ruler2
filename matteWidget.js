//widget som demonstrerer oppgave der tall plasseres relativt på en tallinje
//GUI er bygd opp vha grafikkbiblioteket Konva. Stage -> Layer -> Text|Images|etc

//import axios from "axios";
export default class MatteWidget {
  //class MatteWidget {
  constructor(divElementId, config, answer = null, onAnswer, options) {
    this.test_id;

    var $_GET = {},
      //$_GET contains posted url query variables
      args = location.search.substr(1).split(/&/);
    for (var i = 0; i < args.length; ++i) {
      var tmp = args[i].split(/=/);
      if (tmp[0] != "") {
        $_GET[decodeURIComponent(tmp[0])] = decodeURIComponent(
          tmp.slice(1).join("").replace("+", " ")
        );
      }
    }

    if (localStorage.getItem("tasknr") == "null") {
      localStorage.setItem("tasknr", "0");
    }

    document.getElementById("widget-container").style.display = "none";

    //show if content
    if (
      $_GET.testid != "" &&
      $_GET.testid != undefined &&
      this.isNumeric($_GET.testid)
    ) {
      this.test_id = parseInt($_GET.testid);
    } else this.test_id = 11; //default

    // if ($_GET.order_random != undefined && $_GET.order_random != "") {
    //   this.order_random = $_GET.order_random;
    //   document.getElementById("order_random").checked = "on";
    // }

    //ruler x and y and width/length (global attributes ruler object - not ideal)
    this.ruler_x = 50;
    this.ruler_y = 500;
    this.ruler_width = 650;
    this.ruler_height = 5;
    this.y_drag_nums = 120;
    this.x_nextbtn = 605;
    this.y_nextbtn = 625;
    this.fixed_anchor_width = 20; //place physical number center at ruler fraction point (according to scale)
    //let w_this = this;
    this.width = window.innerWidth - 100;
    this.height = window.innerHeight - 100;

    this.img = "";

    //show ruler with header, name input and tasks
    //**********************************/
    this.getTestItems(this);
    //**********************************/
  }

  async mounted() {
    let that = this;
    try {
      const response = await axios.get("http://localhost:1337/tests");
      that.allTests = response.data;
    } catch (error) {
      this.error = error;
    }
  }

  async saveAttemptToBackend() {
    //let that = this;
    let xx = this.modifiedData_attempts.Numbers_solved.split(";");

    xx.sort();
    for (let j = 0; j < xx.length; j++) {
      xx[j] = xx[j].substring(xx[j].indexOf("|") + 1);
    }
    let str_xx = xx.join(";");
    this.modifiedData_attempts.Numbers_solved = str_xx;

    try {
      const response = await axios.post(
        "http://localhost:1337/attempts",
        this.modifiedData_attempts
      );

      console.log(response);
    } catch (error) {
      this.error = error;
    }
    window.location.reload();
  }

  //************************ */
  //Build number ruler GUI, with test set data from backend
  async getTestItems(t) {
    let z_this = t;
    try {
      const response = await axios.get("http://localhost:1337/tests");
      const testItems = response.data;

      let index = testItems.findIndex(({ id }) => id === this.test_id);

      console.log(index);

      //temp solution: fetch first and only test [0]
      let test = testItems[index];
      //console.log(test);
      if (this.test_id != undefined && test != undefined) {
        var th = document.getElementById("testheader");

        //header title
        th.style =
          "width: 400px;color:black;position: absolute;left: 375px; top: 40px;font-size:28px;font-weight:bold; font-family: Century Schoolbook;";
        let tname = th.appendChild(document.createTextNode(test.Testname));

        var name_in = document.getElementById("nameinput");
        name_in.style =
          "width: 400px;color:black;position: absolute;left: 300px; top: 90px;font-family: Century Schoolbook;font-size:24px";

        var d_tp = name_in.appendChild(document.createElement("DIV"));
        d_tp.setAttribute("id", "div_testperson");
        //d_tp.style = "top:500px;left:2000px;";

        //let tdisc =
        d_tp.appendChild(document.createTextNode(test.Description));
        d_tp.innerHTML += "<br/><br/>";

        var inn_div = d_tp.appendChild(document.createElement("DIV"));
        inn_div.setAttribute("id", "inner_div_testperson");
        inn_div.style = "position: absolute;top: 9px;left: 2px;";

        var name_lbl = inn_div.appendChild(document.createElement("LABEL"));
        name_lbl.style =
          "position: absolute;top: 375px;left: 5px;font-size:18px";
        name_lbl.innerHTML += "Skriv inn navnet ditt: ";
        name_lbl.setAttribute("for", "testperson");
        var inp = inn_div.appendChild(document.createElement("INPUT"));
        inp.style =
          "position: absolute;top: 400px;left: 2px;width:180px;height:20px;";
        this.setAttributes(inp, {
          type: "text",
          id: "testperson",
          name: "testperson",
        });

        //show name field if name input is required for test ("Enter_tester_name" is checked in backend)
        if (test.Enter_tester_name === true) {
          inn_div.setAttribute("style", "display: block");
        } else inn_div.setAttribute("style", "display: none");

        d_tp.innerHTML += "<br>";
        //Pressed button to start tasks
        var x = d_tp.appendChild(document.createElement("INPUT"));
        x.setAttribute("type", "button");
        x.style =
          "font-size: 22px;position: absolute;top:400px;left: 400px;color: antiquewhite;width:150px;background-color: deepskyblue;";
        x.setAttribute("value", "Ta oppgave");
        x.addEventListener("click", () => {
          if (
            test.Enter_tester_name === true &&
            document.getElementById("testperson").value == ""
          ) {
            alert("Skriv inn navnet ditt!");
          } else {
            document.getElementById("widget-container").style.display = "block";
            document.getElementById("nameinput").style.display = "none";
          }
        });

        //show tasks in random order if test has this setting ("Order_random" is checked in backend)
        let random_order = test.Order_random === true ? true : false;
        console.log(random_order);

        //********************** */
        //Build GUI using KONVA
        var stage = new Konva.Stage({
          container: "widget-container",
          width: this.width,
          height: this.height,
        });
        var layer = new Konva.Layer();
        const ruler_group = new Konva.Group();

        var nextbutton = new Konva.Label({
          x: this.x_nextbtn,
          y: this.y_nextbtn,
          opacity: 0.75,
        });
        layer.add(nextbutton);

        nextbutton.add(
          new Konva.Tag({
            fill: "deepskyblue",
            lineJoin: "round",
            shadowColor: "black",
            shadowBlur: 10,
            shadowOffset: 10,
            shadowOpacity: 0.5,
          })
        );

        nextbutton.add(
          new Konva.Text({
            text: "Neste",
            fontFamily: "Calibri",
            fontSize: 20,
            padding: 5,
            fill: "antiquewhite",
          })
        );

        //******************* */
        //Clicked "Next" button
        //******************* */
        nextbutton.on("click", () => {
          localStorage.setItem(
            "tasknr",
            parseInt(localStorage.getItem("tasknr")) + 1
          );
          if (parseInt(localStorage.getItem("tasknr")) >= test.tasks.length) {
            alert("Takk for at du har løst oppgavene!");
          }
          //alert("Neste oppgavenr er " + localStorage.getItem("tasknr"));
          if (document.getElementById("testperson").value != "") {
            localStorage.setItem(
              "username",
              document.getElementById("testperson").value
            );
          }

          z_this.saveAttemptToBackend();
        });

        //If beyond last task, start opening name input screen and reset task_nr
        if (parseInt(localStorage.getItem("tasknr")) >= test.tasks.length) {
          document.getElementById("widget-container").style.display = "none";
          document.getElementById("nameinput").style.display = "block";
          localStorage.setItem("tasknr", 0);
        }

        let taskid = parseInt(localStorage.getItem("tasknr"));

        //Check if there is a task after the current one
        //if no following task, show "Ferdig" button and end test
        if (parseInt(localStorage.getItem("tasknr")) < test.tasks.length - 1) {
          nextbutton.children[1].setAttr("text", "Neste oppgave");
        } else {
          nextbutton.children[1].setAttr("text", "Avslutt");
        }

        //populate object for saving attempt each time user clicks "Neste" or "Ferdig" button
        this.modifiedData_attempts = {
          Taskname: test.tasks[taskid].Taskname,
          Testname: test.Testname,
          Username: localStorage.getItem("username"),
          Numbers: test.tasks[taskid].Num_dyna,
          Numbers_solved: "",
          Time_spent: "124",
        };

        //layer.draw();

        var imageObj = new Image();
        imageObj.onload = function () {
          let ruler_img = new Konva.Image({
            x: z_this.ruler_x,
            y: z_this.ruler_y,
            image: imageObj,
            width: z_this.ruler_width,
            height: z_this.ruler_height,
          });
          // add the shape to the layer
          ruler_group.add(ruler_img);
          layer.batchDraw();
        };
        imageObj.src = "./img/ruler.png";

        if (parseInt(localStorage.getItem("tasknr")) > 0) {
          document.getElementById("widget-container").style.display = "block";
          document.getElementById("nameinput").style.display = "none";
        }

        let scale_from = test.tasks[taskid].Scale_from;
        let scale_to = test.tasks[taskid].Scale_to;
        scale_from = scale_from.includes("/") ? eval(scale_from) : scale_from;
        scale_to = scale_to.includes("/") ? eval(scale_to) : scale_to;

        //movable numbers
        let mov_nums = test.tasks[taskid].Num_dyna.split(/;/);
        for (var i = 0; i < mov_nums.length; ++i) {
          //html for making fraction img for ruler
          //********************************************************** */
          let fract_div = document.getElementById("fract");
          fract_div.style = "display:block";
          if (mov_nums[i].includes("/")) {
            fract_div.children[0].innerHTML = mov_nums[i].split("/")[0];
            fract_div.children[1].innerHTML = mov_nums[i].split("/")[1];
          } else {
            fract_div.children[2].innerHTML = mov_nums[i];
          }
          //********************************************************** */

          this.ii = i;
          let x_num_coor = this.ruler_x + this.ruler_width;
          switch (i) {
            case 0:
              x_num_coor /= 5;
              break;
            case 1:
              x_num_coor /= 2;
              break;
            case 2:
              x_num_coor /= 1.25;
              break;
            default:
              x_num_coor /= 2;
          }

          var drag_number = new Konva.Group({
            x: x_num_coor,
            y: this.y_drag_nums,
            width: 55,
            height: 30,
            rotation: 0,
            draggable: true,
            text: "drag",
          });

          drag_number.add(
            new Konva.Rect({
              width: 45,
              height: 50,
              y: -6,
              stroke: "deepskyblue",
              fill: "white",
              strokeWidth: 4,
            })
          );

          drag_number.add(
            new Konva.Rect({
              x: 20,
              y: 42,
              width: 4,
              height: 150,
              fill: "deepskyblue",
            })
          );

          z_this.makeImgNum(layer, drag_number);

          //for saving attempts to backend
          z_this.modifiedData_attempts.Numbers_solved +=
            i != 0 ? ";" + i + "|" + "none" : i + "|" + "none";

          //event handlers for moving object
          drag_number.on("mouseover", function () {
            document.body.style.cursor = "pointer";
          });
          drag_number.on("mouseout", function () {
            document.body.style.cursor = "default";
          });

          drag_number.on("dragstart", function () {
            document.body.style.cursor = "default";
          });

          drag_number.on("dragend", function (e) {
            console.log(e);
            document.body.style.cursor = "default";

            // to align text in the middle of the screen, we can set the
            // shape offset to the center of the text shape after instantiating it
            //drag_number.offsetX(drag_number.width() / 2);

            let ruler = ruler_group.children[0];
            //calculate relative position of number out on ruler
            // scale-start +
            //  (difference from scale-start to scale-end)
            //  *
            //  position-of-number - startposition-ruler
            //  /
            //  width-of-ruler - startposition-ruler
            let fraction =
              eval(scale_from) +
              ((scale_to - scale_from) * (this.x() - ruler.x())) /
                (ruler.width() - ruler.x());

            //if number is put beyond scale end, it gets the scale end position
            if (fraction > scale_to) fraction = scale_to;
            //if number is put before scale start, it gets the scale start position
            if (fraction < scale_from) fraction = scale_from;

            let numb = "";
            //if number hitting ruler area
            if (
              this.y() < z_this.ruler_y + 0 &&
              this.y() > z_this.ruler_y - 160
            ) {
              alert(
                "Posisjonen til tallet " +
                  //this.text().split("|")[0] +
                  this.children[2].text() +
                  " er " +
                  eval(fraction).toFixed(2) +
                  //fraction +
                  " på en skala fra " +
                  scale_from +
                  " til " +
                  scale_to
              );

              numb = z_this.modifiedData_attempts.Numbers_solved;
              if (this.attrs.i_txt != "undefined") {
                let numb_ar =
                  z_this.modifiedData_attempts.Numbers_solved.split(";");

                z_this.removeItem(numb_ar, this.attrs.i_txt + "|");

                numb = numb_ar.join(";");
              }

              z_this.modifiedData_attempts.Numbers_solved =
                numb == "" || numb == "null"
                  ? numb + this.attrs.i_txt + "|" + eval(fraction).toFixed(2)
                  : numb +
                    ";" +
                    this.attrs.i_txt +
                    "|" +
                    eval(fraction).toFixed(2);

              console.log("yes");
            } else {
              numb = z_this.modifiedData_attempts.Numbers_solved;
              if (this.attrs.i_txt != "undefined") {
                z_this.modifiedData_attempts.Numbers_solved =
                  numb == "" || numb == "null"
                    ? numb + this.attrs.i_txt + "|" + "none"
                    : numb + ";" + this.attrs.i_txt + "|" + "none";
              }
            }
          });

          layer.add(drag_number);
          drag_number.zIndex(1);
        }

        let anchor_nums = test.tasks[taskid].Num_static.split(/;/);
        for (var i = 0; i < anchor_nums.length; ++i) {
          let anchor = anchor_nums[i];

          //html for making fraction img for ruler
          //********************************************************** */
          let fract_div = document.getElementById("fract");
          fract_div.style = "display:block";
          if (anchor_nums[i].includes("/")) {
            fract_div.children[0].innerHTML = anchor.split("/")[0];
            fract_div.children[1].innerHTML = anchor.split("/")[1];
          } else {
            fract_div.children[2].innerHTML = anchor;
          }
          //********************************************************** */
          let anchor_txt = anchor;
          anchor = anchor.includes("/") ? eval(anchor) : anchor;
          let brok = (anchor - scale_from) / (scale_to - scale_from);
          brok = brok * this.ruler_width;
          brok = brok + this.ruler_x;
          brok -= this.fixed_anchor_width;

          //************************************* */
          //anchors with tickmarks on ruler
          let anchor_number = new Konva.Group({
            x: brok - 5,
            y: this.ruler_y + 10,
            width: 90,
            height: 70,
            rotation: 0,
            Draggable: false,
          });

          anchor_number.add(
            new Konva.Rect({
              width: 40,
              height: 40,
              //stroke: "brown",
              //strokeWidth: 4,
            })
          );

          anchor_number.add(
            new Konva.Rect({
              x: 25,
              y: -17,
              width: 3,
              height: 20,
              fill: "black",
            })
          );

          z_this.makeImgNum(layer, anchor_number);

          layer.add(anchor_number);
          anchor_number.zIndex(1);
        }

        let scale_nums = [
          test.tasks[taskid].Scale_from,
          test.tasks[taskid].Scale_to,
        ];
        for (let i = 0; i < scale_nums.length; i++) {
          //html for making fraction img for ruler
          //********************************************************** */
          let fract_div = document.getElementById("fract");
          fract_div.style = "display:block";
          if (scale_nums[i].includes("/")) {
            fract_div.children[0].innerHTML = scale_nums[i].split("/")[0];
            fract_div.children[1].innerHTML = scale_nums[i].split("/")[1];
          } else {
            fract_div.children[2].innerHTML = scale_nums[i];
          }

          //********************************************************** */

          //************************************* */
          //start and end line scale anchors with tickmarks on ruler
          let lbl_tick_scale = new Konva.Group({
            //start - and end ticket mark
            x:
              i == 0 ? this.ruler_x - 30 : this.ruler_x + this.ruler_width - 30,
            y: this.ruler_y + 10,
            width: 90,
            height: 70,
            rotation: 0,
            Draggable: false,
          });

          lbl_tick_scale.add(
            new Konva.Rect({
              width: 40,
              height: 40,
              //stroke: "brown",
              //strokeWidth: 4,
            })
          );

          lbl_tick_scale.add(
            new Konva.Rect({
              x: 30,
              y: -17,
              width: 3,
              height: 20,
              fill: "black",
            })
          );

          z_this.makeImgNum(layer, lbl_tick_scale);

          /* lbl_tick_scale.add(
            new Konva.Text({
              text: scale_nums[i],
              fontSize: 20,
              fontFamily: "Calibri",
              fill: "lightslategray",
            })
          ); */

          layer.add(lbl_tick_scale);
          // layer.add(label_scaleend);
          fract_div.style = "display:none";
        }

        // add the rect shape to the ruler group
        layer.add(ruler_group);
        ruler_group.zIndex(0);

        // add the layer to the stage
        stage.add(layer);
      } else {
        document
          .getElementById("widget-container")
          .appendChild(document.createTextNode("Test er ikke tilgjengelig"));
        document.getElementById("widget-container").style.display = "block";
        alert("Test er ikke tilgjengelig");
      }

      //return testItems;
    } catch (errors) {
      console.error(errors);
    }
  }

  async removeItem(array, item) {
    for (var i in array) {
      if (array[i].includes(item)) {
        array.splice(i, 1);
        break;
      }
    }
  }
  async isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  async setAttributes(el, attrs) {
    for (var key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }

  async makeImgNum(lay, num) {
    // convert DOM into image
    var z_this = this;
    let h = 35,
      w = 35,
      y_pos = 0,
      x_pos = 0;

    //if fraction
    if ($("#fract")[0].children[2].innerHTML == "") {
      y_pos = h - h * 0.95;
      x_pos = w / 2 + w * 0.1;
      //integer or decimal
    } else {
      y_pos = h / 2 - h / 4;
      x_pos = num.attrs.text == "drag" ? w / 2 + w * 0.05 : w / 2 + w * 0.15;
    }
    html2canvas($("#fract")[0], {
      width: 35,
      height: 35,
      backgroundColor: null,
    })
      .then((canvas) => {
        z_this.img = canvas.toDataURL("image/jpg");
        Konva.Image.fromURL(z_this.img, function (imag) {
          imag.setAttrs({
            x: x_pos,
            y: y_pos,
            width: w,
            height: h,
          });
          num.add(imag);
          lay.batchDraw();
        });
        return true;
      })
      .catch(function (error) {
        /* This is fired when the promise executes without the DOM */
        console.log(error);
        return false;
      });
  }
}
