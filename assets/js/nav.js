$(document).ready(main);

var counter = 1 ;

function main(){
  $('.menu-bar').click(function(){
    if(counter == 1){
      $('header').animate({
        left: '0'
      });
      counter = 0;
    } else {
      counter = 1;
      $('header').animate({
        left: '-100%'
      })
    }
  })
  
};