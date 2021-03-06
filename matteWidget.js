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
    this.anch_dY_from_ruler = 10;
    this.anch_dX_from_ruler = 0;
    this.tick_scale_W = 40;
    this.tick_scale_H = 40;
    this.tick_height = 10;
    this.tick_width = 2;
    this.tick_y_pos = -12;
    this.html2c_H = 35;
    this.html2c_W = 35;
    this.y_dragnums = 120;
    this.dragnum_container_W = 40;
    this.dragnum_container_H = 50;
    this.dragmarker_W = 4;
    this.x_nextbtn = 605;
    this.y_nextbtn = 575;
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
          "width: 400px;color:black;position: relative;left: 300px; top: 20px;font-size:28px;font-weight:bold; font-family: Century Schoolbook;";
        let tname = th.appendChild(document.createTextNode(test.Testname));

        var name_in = document.getElementById("nameinput");
        name_in.style =
          "width: 400px;color:black;position: relative;left: 175px; top: 30px;font-family: Century Schoolbook;font-size:24px";

        var d_tp = name_in.appendChild(document.createElement("DIV"));
        d_tp.setAttribute("id", "div_testperson");
        //d_tp.style = "top:500px;left:2000px;";

        //let tdisc =
        d_tp.appendChild(document.createTextNode(test.Description));
        d_tp.innerHTML += "<br/><br/>";

        var inn_div = d_tp.appendChild(document.createElement("DIV"));
        inn_div.setAttribute("id", "inner_div_testperson");
        inn_div.style = "position: relative;top: 9px;left: -200px;";

        var name_lbl = inn_div.appendChild(document.createElement("LABEL"));
        name_lbl.style =
          "position: relative;top: 200px;left: 150px;font-size:18px";
        name_lbl.innerHTML += "Skriv inn navnet ditt: ";
        name_lbl.setAttribute("for", "testperson");
        var inp = inn_div.appendChild(document.createElement("INPUT"));
        inp.style =
          "position: relative;top: 225px;left: -35px;width:180px;height:20px;";
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
          "font-size: 22px;position: relative;top:175px;left: 410px;color: antiquewhite;width:150px;background-color: deepskyblue;";
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
          document.getElementById("nameinput").style.display = "none";
          localStorage.setItem("tasknr", 0);
          document.getElementById("testheader").innerText =
            "Takk for at du løste oppgaver!";
        }

        let taskid = parseInt(localStorage.getItem("tasknr"));

        //Check if there is a task after the current one
        //if no following task, show "Ferdig" button and end test
        if (parseInt(localStorage.getItem("tasknr")) < test.tasks.length - 1) {
          nextbutton.children[1].setAttr("text", "Neste oppgave");
        } else {
          nextbutton.children[1].setAttr("text", "Avslutt");
        }

        layer.add(nextbutton);
        nextbutton.zIndex(1);

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

          //MAKES FRACTION LINE IF FRACTION, LINE LENGTH = LONGEST NUMBER STRING
          this.setCSSNumberDisplay(mov_nums[i]);

          //PLACING 5 FIRST MOVABLE NUMBERS FROM 'FORSKER' APP/STRAPI WITH CORRECT PIXEL DISTANCE
          this.ii = i;
          let x_num_coor = this.ruler_x + this.ruler_width;
          switch (i) {
            case 0:
              x_num_coor /= 3.8;
              break;
            case 1:
              x_num_coor /= 2;
              break;
            case 2:
              x_num_coor /= 1.4;
              break;
            case 3:
              x_num_coor /= 20;
              break;
            case 4:
              x_num_coor /= 1.06;

              break;
            default:
              x_num_coor /= 2;
          }

          //DRAGGABLE NUMBERS
          var drag_number = new Konva.Group({
            x: x_num_coor,
            y: this.y_dragnums,
            width: 55,
            height: 30,
            rotation: 0,
            draggable: true,
            text: "drag",
          });

          drag_number.add(
            new Konva.Rect({
              width: this.dragnum_container_W,
              height: this.dragnum_container_H,
              stroke: "deepskyblue",
              fill: "white",
              strokeWidth: 4,
            })
          );

          drag_number.add(
            new Konva.Rect({
              x: this.dragnum_container_W / 2 - this.dragmarker_W / 2,
              y: 48,
              width: this.dragmarker_W,
              height: 150,
              fill: "deepskyblue",
            })
          );

          //THE NUMBER ITSELF
          z_this.makeImgNum(layer, drag_number, mov_nums[i]);

          //SAVING ATTEMPTS TO BACKEND
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
              ((scale_to - scale_from) *
                (this.x() +
                  (z_this.dragnum_container_W / 2 - z_this.dragmarker_W / 2) -
                  ruler.x())) /
                ruler.width();

            //fraction -= fraction / 20;

            //if number is put beyond scale end, it gets the scale end position
            if (fraction > scale_to) fraction = scale_to;
            //if number is put before scale start, it gets the scale start position
            if (fraction < scale_from) fraction = scale_from;

            let numb = "";
            //if number hitting ruler area
            if (
              this.y() < z_this.ruler_y + 0 &&
              this.y() > z_this.ruler_y - 180
            ) {
              alert(
                "Posisjonen til tallet " +
                  //this.text().split("|")[0] +
                  //this.children[2].text() +
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

        //******* */
        //ANCHORS
        //******* */

        let anchor_nums = test.tasks[taskid].Num_static.split(/;/);
        for (var i = 0; i < anchor_nums.length; ++i) {
          //let anchor = anchor_nums[i];

          //html for making fraction img for ruler
          //********************************************************** */

          //makes fraction line if fraction, line length = longest number string
          this.setCSSNumberDisplay(anchor_nums[i]);

          let anch_txt = anchor_nums[i]; // for evaluating fraction char lenght for layout
          anchor_nums[i] = anchor_nums[i].includes("/")
            ? eval(anchor_nums[i])
            : anchor_nums[i];
          let brok = (anchor_nums[i] - scale_from) / (scale_to - scale_from);
          brok = brok * this.ruler_width;
          brok += this.ruler_x;
          brok -= this.fixed_anchor_width;

          //************************************* */
          //anchors with tickmarks on ruler
          let anchor_number = new Konva.Group({
            x: brok,
            y: this.ruler_y + this.anch_dY_from_ruler,
            /* width: 90,
            height: 70,
            rotation: 0, 
            Draggable: false,*/
          });

          anchor_number.add(
            new Konva.Rect({
              width: this.tick_scale_W,
              height: this.tick_scale_H,
              /* stroke: "brown",
              strokeWidth: 4, */
            })
          );

          anchor_number.add(
            new Konva.Rect({
              x: this.tick_scale_W / 2,
              y: this.tick_y_pos,
              width: this.tick_width,
              height: this.tick_height,
              fill: "black",
            })
          );

          z_this.makeImgNum(layer, anchor_number, anch_txt);

          layer.add(anchor_number);
          anchor_number.zIndex(1);
        }

        //********************** */
        //END/START SCALE ANCHS
        //********************** */

        let scale_nums = [
          test.tasks[taskid].Scale_from,
          test.tasks[taskid].Scale_to,
        ];
        for (let i = 0; i < scale_nums.length; i++) {
          //html for making fraction img for ruler
          //********************************************************** */

          //makes fraction line if fraction, line length = longest number string
          this.setCSSNumberDisplay(scale_nums[i]);

          //start and end line scale anchors with tickmarks on ruler
          let lbl_tick_scale = new Konva.Group({
            //start - and end ticket mark
            x:
              i == 0
                ? this.ruler_x - this.tick_scale_W / 2 // this.anch_dX_from_ruler
                : this.ruler_x + this.ruler_width - this.tick_scale_W / 2, // this.anch_dX_from_ruler,
            y: this.ruler_y + this.anch_dY_from_ruler,
            //width: 90,
            //height: 70,
            //rotation: 0,
            //Draggable: false,
          });

          lbl_tick_scale.add(
            new Konva.Rect({
              width: this.tick_scale_W,
              height: this.tick_scale_H,
              //stroke: 2,
              //stroke: "brown",
              //strokeWidth: 4,
            })
          );

          lbl_tick_scale.add(
            new Konva.Rect({
              x: this.tick_scale_W / 2, // this.anch_dX_from_ruler,
              y: this.tick_y_pos,
              width: this.tick_width,
              height: this.tick_height,
              fill: "black",
            })
          );

          z_this.makeImgNum(layer, lbl_tick_scale, scale_nums[i]);

          layer.add(lbl_tick_scale);
        }

        // add the rect shape to the ruler group
        layer.add(ruler_group);
        ruler_group.zIndex(0);

        this.fract_div.style = "display:none"; //re-hide div containing fractions

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

  async makeImgNum(lay, num_gr, number) {
    // convert DOM into image
    var z_this = this;
    let w = this.html2c_W;
    let h = this.html2c_H;

    html2canvas($("#fract")[0], {
      width: w,
      height: h,
      backgroundColor: null,
    })
      .then((canvas) => {
        z_this.img = canvas.toDataURL("image/jpg");
        let y_pos, x_pos;
        /* w = canvas.width;
        h = canvas.height; */

        let nb = $("#fract")[0].children[2].innerHTML;
        //IF FRACTION: CALIBRATE MARKER AND NUMBER ACCORDINGLY
        if (nb == undefined || nb == "") {
          //if (number.includes("/")) {
          let div_fact = number.toString().length > 3 ? 3.9 : 2.4;
          if (num_gr.attrs.text == "drag") {
            x_pos = 1; // this.tick_scale_W / div_fact; //w / 2 - w * 0.05; //draggables
            y_pos = h - h * 0.8;
          } else {
            x_pos = 1; // this.tick_scale_W / div_fact; // w / 2 + w * 0.1; //anchors
            y_pos = 4; //h - h * 0.8;
          }
          //INTEGER OR DECIMAL: CALIBARATE MARKER AND NUMBER ACCORDINGLY
        } else {
          if (num_gr.attrs.text == "drag") {
            x_pos = 1; // = num_gr.width() / 2 - w / 3; //* 0.1; //draggables
            y_pos = h / 5;
          } else {
            x_pos = 3; // w / 2 + w * 0.15; //anchors
            y_pos = 4; //h / 2 - h / 4;
          }
        }
        Konva.Image.fromURL(z_this.img, function (imag) {
          imag.setAttrs({
            x: x_pos,
            y: y_pos,
            width: w,
            height: h,
            //stroke: 2,
          });
          num_gr.add(imag);
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

  //html for making fraction img for ruler
  //********************************************************** */
  async setCSSNumberDisplay(element) {
    this.fract_div = document.getElementById("fract");
    //this.fract_div.style = "display:block";
    if (element.includes("/")) {
      let css_num = "",
        css_denom = "";
      if (element.split("/")[0].length > element.split("/")[1].length) {
        css_num = "numerator_biggest";
        css_denom = "denominator_smallest";
      } else {
        css_num = "numerator_smallest";
        css_denom = "denominator_biggest";
      }

      this.fract_div.children[0].innerHTML = element.split("/")[0];
      this.fract_div.children[0].setAttribute("class", css_num);
      this.fract_div.children[1].innerHTML = element.split("/")[1];
      this.fract_div.children[1].setAttribute("class", css_denom);
      /* this.fract_div.children[0].style["text-align"] = "center";
      this.fract_div.children[1].style["text-align"] = "center"; */
    } else {
      this.fract_div.children[2].innerHTML = element;
    }
  }
}
